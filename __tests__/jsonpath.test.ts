import { parseJSON } from "@/lib/parser/parse";
import { jsonPath, type Result } from "@/lib/worker/command/jsonPath";
import { getViewState } from "@/lib/worker/stores/viewStore";
import { readFileIfNeed } from "./utils";

function expectEq(result: Result, expected: unknown) {
  expect(JSON.parse(result.output ?? "")).toEqual(expected);
}

// copy from https://github.com/JSONPath-Plus/JSONPath/blob/main/test/test.examples.js
describe("JSON path filter", () => {
  const text = readFileIfNeed("json_path.txt");
  const json = JSON.parse(text);
  getViewState().setTree(parseJSON(text));

  test("wildcards (with and without $.)", () => {
    const books = json.store.book;
    const expected = [books[0].author, books[1].author, books[2].author, books[3].author];
    let result = jsonPath("$.store.book[*].author");
    expectEq(result, expected);
    result = jsonPath("store.book[*].author");
    expectEq(result, expected);
  });

  test("all properties, entire tree", () => {
    const books = json.store.book;
    const expected = [books[0].author, books[1].author, books[2].author, books[3].author];
    const result = jsonPath("$..author");
    expectEq(result, expected);
  });

  test("all sub properties, single level", () => {
    const expected = [json.store.book, json.store.bicycle];
    const result = jsonPath("$.store.*");
    expectEq(result, expected);
  });

  test("all sub properties, entire tree", () => {
    const books = json.store.book;
    const expected = [books[0].price, books[1].price, books[2].price, books[3].price, json.store.bicycle.price];
    const result = jsonPath("$.store..price");
    expectEq(result, expected);
  });

  test("n property of entire tree", () => {
    const books = json.store.book;
    const expected = books[2];
    const result = jsonPath("$..book[2]");
    expectEq(result, expected);
  });

  test("last property of entire tree", () => {
    const books = json.store.book;
    const expected = books[3];
    let result = jsonPath("$..book[(@.length-1)]");
    expectEq(result, expected);

    result = jsonPath("$..book[-1:]");
    expectEq(result, expected);
  });

  test("range of property of entire tree", () => {
    const books = json.store.book;
    const expected = [books[0], books[1]];
    let result = jsonPath("$..book[0,1]");
    expectEq(result, expected);

    result = jsonPath("$..book[:2]");
    expectEq(result, expected);
  });

  test("categories and authors of all books", () => {
    const expected = ["reference", "Nigel Rees"];
    const result = jsonPath("$..book[0][category,author]");
    expectEq(result, expected);
  });

  test("filter all properties if sub property exists, of entire tree", () => {
    const books = json.store.book;
    const expected = [books[2], books[3]];
    const result = jsonPath("$..book[?(@.isbn)]");
    expectEq(result, expected);
  });

  test("filter all properties if sub property greater than of entire tree", () => {
    const books = json.store.book;
    const expected = [books[0], books[2]];
    const result = jsonPath("$..book[?(@.price<10)]");
    expectEq(result, expected);
  });

  test("@ as a scalar value", () => {
    const expected = [
      json.store.bicycle.price,
      ...json.store.book.slice(1).map((book: any) => {
        return book.price;
      }),
    ];
    const result = jsonPath("$..*[?(@property === 'price' && @ !== 8.95)]");
    expectEq(result, expected);
  });

  test("all properties of a JSON structure (beneath the root)", () => {
    const expected = [json.store, json.store.book, json.store.bicycle];
    json.store.book.forEach((book: any) => {
      expected.push(book);
    });
    json.store.book.forEach(function (book: any) {
      Object.keys(book).forEach(function (p) {
        expected.push(book[p]);
      });
    });
    expected.push(json.store.bicycle.color, json.store.bicycle.price);

    const result = jsonPath("$..*");
    expectEq(result, expected);
  });

  test("all parent components of a JSON structure", () => {
    const expected = [json, json.store, json.store.book];
    json.store.book.forEach((book: any) => {
      expected.push(book);
    });
    expected.push(json.store.bicycle);

    const result = jsonPath("$..");
    expectEq(result, expected);
  });

  test("root", () => {
    const expected = json;
    const result = jsonPath("$");
    expectEq(result, expected);
  });

  test("Custom operator: parent (caret)", () => {
    const expected = [json.store, json.store.book];
    const result = jsonPath("$..[?(@.price>19)]^");
    expectEq(result, expected);
  });

  // A bug of JSONPath-Plus is that ~ for grabbing property names of matching items is not compatible with JSON pointer.
  // test("Custom operator: property name (tilde)", () => {
  //   const expected = ["book", "bicycle"];
  //   const result = jsonPath("$.store.*~");
  //   expectEq(result, expected);
  // });

  test("Custom property @path", () => {
    const expected = json.store.book.slice(1);
    const result = jsonPath("$.store.book[?(@path !== \"$['store']['book'][0]\")]");
    expectEq(result, expected);
  });

  test("Custom property: @parent", () => {
    const expected = ["reference", "fiction", "fiction", "fiction"];
    const result = jsonPath('$..book[?(@parent.bicycle && @parent.bicycle.color === "red")].category');
    expectEq(result, expected);
  });

  test("Custom property: @property", () => {
    let expected = json.store.book.reduce(function (arr: any, book: any) {
      arr.push(book.author, book.title);
      if (book.isbn) {
        arr.push(book.isbn);
      }
      arr.push(book.price);
      return arr;
    }, []);
    let result = jsonPath('$..book.*[?(@property !== "category")]');
    expectEq(result, expected);

    expected = json.store.book.slice(1);
    result = jsonPath("$..book[?(@property !== 0)]");
    expectEq(result, expected);
  });

  test("Custom property: @parentProperty", () => {
    let expected = [json.store.bicycle.color, json.store.bicycle.price];
    let result = jsonPath('$.store.*[?(@parentProperty !== "book")]');
    expectEq(result, expected);

    expected = json.store.book.slice(1).reduce(
      (rslt: any, book: any) => [
        ...rslt,
        ...Object.keys(book).reduce((reslt: any, prop) => {
          reslt.push(book[prop]);
          return reslt;
        }, []),
      ],
      [],
    );
    result = jsonPath("$..book.*[?(@parentProperty !== 0)]");
    expectEq(result, expected);
  });

  test("Custom property: @root", () => {
    const expected = json.store.book[2];
    const result = jsonPath("$..book[?(@.price === @root.store.book[2].price)]");
    expectEq(result, expected);
  });

  test("@number()", () => {
    const expected = [8.95, 12.99, 8.99, 22.99];
    const result = jsonPath("$.store.book..*@number()");
    expectEq(result, expected);
  });

  test("Regex on value", () => {
    const expected = [json.store.book[1].category, json.store.book[2].category, json.store.book[3].category];
    const result = jsonPath('$..book.*[?(@property === "category" && @.match(/TION$/i))]');
    expectEq(result, expected);
  });

  test("Regex on property", () => {
    const books = json.store.book;
    const expected = [books[2], books[3]];
    const result = jsonPath("$..book.*[?(@property.match(/bn$/i))]^");
    expectEq(result, expected);
  });
});
