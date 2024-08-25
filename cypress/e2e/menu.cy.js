describe('menu actions', () => {
  describe('escape and unescape', () => {
    it('escape and unescape', () => {
      const src = `{"foo":"bar"}`;

      cy.editorType(src)
        .waitInput();

      cy.get("#leftMenu")
        .click();
      cy.contains("转义")
        .click()
        .wait(50)
        .editorText()
        .then((s) => {
          expect(s).to.have.string("\\");
        });

      cy.wait(50)
        .get("#leftMenu")
        .click();
      cy.contains("去转义")
        .click()
        .wait(50)
        .editorText()
        .then((s) => {
          expect(s).to.eq(src);
        });
    });
  });

  describe('sort', () => {
    it('sort', () => {
      const src = `{"b":2, "a":1, "c":3}`;

      cy.editorType(src)
        .waitInput();

      cy.get("#leftMenu")
        .click();
      cy.contains("排序（升序）")
        .click()
        .wait(50)
        .editorText()
        .then((s) => {
          expect(JSON.parse(s)).to.deep.equal({"a": 1, "b": 2, "c": 3});
        });

      cy.wait(50)
        .get("#leftMenu")
        .click();
      cy.contains("排序（降序）")
        .click()
        .wait(50)
        .editorText()
        .then((s) => {
          expect(JSON.parse(s)).to.deep.equal({"c": 3, "b": 2, "a": 1});
        });
    });
  });

  describe('URL to JSON', () => {
    it('url2json', () => {
      const src = `http://localhost:3000/`;

      cy.editorType(src)
        .waitInput();

      cy.get("#leftMenu")
        .click();
      cy.contains("URL 转 JSON")
        .click()
        .wait(50)
        .editorText()
        .then((s) => {
          expect(JSON.parse(s)).to.deep.equal({"Scheme": "http:", "Host": "localhost", "Port": "3000"});
        });
    });
  });

  describe('python dict to JSON', () => {
    it('python dict to JSON', () => {
      const src = `{'a': '1', 'b': '2', 'c': '3'}`;

      cy.editorType(src)
        .waitInput();

      cy.get("#leftMenu")
        .click();
      cy.contains("Python Dict 转 JSON")
        .click()
        .wait(50)
        .editorText()
        .then((s) => {
          expect(JSON.parse(s)).to.deep.equal({'a': '1', 'b': '2', 'c': '3'});
        });
    });
  });
});
