describe('page interaction', () => {
  describe('statusbar', () => {
    beforeEach(function () {
      cy.fixture("compare_data1.txt").as("text");
    });

    it('line and column', () => {
      cy.dropFile("@text")
        .wait(50);
      cy.editorType("{end}{downArrow}{downArrow}{end}{leftArrow}", "left", true);
      cy.contains("3:19");
    });

    it('selection length', () => {
      cy.dropFile("@text")
        .wait(50);
      cy.editorType("{shift}{downArrow}{downArrow}", "left", true);
      cy.contains("24");
    });

    it('json path', () => {
      cy.dropFile("@text")
        .wait(50);
      cy.editorType("{end}{downArrow}{downArrow}{end}{leftArrow}", "left", true);
      cy.get('.statusbar > div:nth-child(3)')
        .invoke("text")
        .should('have.string', 'Aidan Gillen')
        .should('have.string', 'a_null');
    });
  });

  describe('redux-persist save switch status', () => {
    it('enable and disable', () => {
      cy.contains("自动格式化")
        .parent()
        .click()
        .get(".switchSlideText-exit-done")
        .getSetting("enableAutoFormat").then((v) => {
        expect(v).to.equal(false);
      });

      cy.reload()
        .visitHome()
        .getSetting("enableAutoFormat").then((v) => {
        expect(v).to.be.false;
      });

      cy.contains("自动格式化")
        .parent()
        .click()
        .get(".switchSlideText-enter-done")
        .getSetting("enableAutoFormat").then((v) => {
        expect(v).to.be.true;
      });

      cy.reload()
        .visitHome()
        .getSetting("enableAutoFormat").then((v) => {
        expect(v).to.be.true;
      });
    });
  });

  describe('change width of right editor', () => {
    if (!Cypress.isBrowser('firefox')) {
      it('change width', () => {
        cy.get('#rightEditor')
          .invoke("width")
          .then((w) => cy.wrap(w).as("width"));
        cy.get('.dragbar')
          .first()
          .trigger('mousedown', {button: 0})
          .trigger('mousemove', {clientX: 500})
          .trigger('mouseup');
        cy.get('#rightEditor')
          .invoke("width")
          .then((w) =>
            cy.get("@width").should("to.lt", w));
      });
    }
  });
});
