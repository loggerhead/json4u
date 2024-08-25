import {isEqual} from "../../lib/parser";

function checkFormat(text, opt = {src: undefined, side: "left"}) {
  const {src, side} = opt;
  const srcWrap = src === undefined ? cy.get(`@${side}Text`) : cy.wrap(src);

  srcWrap.then((src) => {
    expect(text.length).to.gt(src.length);
    expect(isEqual(text, src)).to.equal(true);
    expect(text.split('\n').length).to.gt(src.split('\n').length);
  });
}

describe('basic functions', () => {
  beforeEach(function () {
    cy.fixture("region_and_currency1.txt").as("leftText");
    cy.fixture("region_and_currency2.txt").as("rightText");
  });

  describe('validate', () => {
    it('validate', () => {
      cy.editorType("{{}{del}", "left", true)
        .wait(50);
      cy.contains(/左侧.*解析错误/);
      cy.editorType("}")
        .wait(50);
      cy.contains(/左侧.*解析错误/)
        .should("not.exist");

      cy.editorType("{{}{del}", "right", true)
        .wait(50);
      cy.contains(/右侧.*解析错误/);
      cy.editorType("}", "right")
        .wait(50);
      cy.contains(/右侧.*解析错误/)
        .should("not.exist");
    });
  });

  describe('format', () => {
    it('paste', () => {
      cy.get("@leftText")
        .then((text) =>
          cy.paste(text))
        .waitInput()
        .editorText()
        .then(checkFormat);
    });

    it('click button', () => {
      const src = `Info 2023-01-01 12:34:56.789 /root/json4u@v0.0.0-20230101123456-bbbbbbbbbbbb/golang/test.go:321 127.0.0.1  www.json4u.com 20230101123456789BBBBBBBBBBBBBBBBB  example all_things en 1111111111111111111 _name=hi-aaa-666  _ipv6=0:0:0:0:0:0:0:0  _msg=@CCCCCCCCCCCCCC.Function -> www.json4u.com#Function(cost=100ms) {{req=
{"foo":"bar","buz":{"qux":{"foobar":"{\"example\":\"321\"}"}}}
}} {{resp=
{"bar":"foo","qux":{"buz":{"foobar":"{\"example\":\"123\"}"}}}
}}`;
      cy.editorType(src)
        .waitInput();
      cy.contains("格式化")
        .click()
        .wait(50)
        .editorText()
        .then((text) =>
          checkFormat(text, {src}));
    });

    it('drag-drop', () => {
      cy.dropFile("@leftText")
        .wait(50)
        .editorText()
        .then(checkFormat);
    });
  });

  describe('minify', () => {
    it('minify', () => {
      cy.dropFile("@leftText")
        .editorText()
        .then(checkFormat);
      cy.contains("最小化")
        .click()
        .wait(50)
        .editorText()
        .then((s) =>
          expect(s.split('\n').length).to.eq(1));
    });
  });
});
