describe('jq', () => {
  beforeEach(function () {
    cy.fixture("currency2region.txt").as("text");
  });

  describe('simple', () => {
    it('[.[] | keys | .[0]] | sort | length', () => {
      cy.dropFile("@text")
        .waitInput();
      cy.get("#cmd-btn")
        .click()
        .wait(1000);
      cy.get("#cmd-mode-input")
        .click()
        .type("[.[] | keys | .[0]] | sort | length");

      cy.waitInput("right");
      cy.editorText("right")
        .then((s) =>
          expect(Number(s)).to.gt(100));
    });
  });
});
