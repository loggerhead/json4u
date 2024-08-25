describe('compare', () => {
  beforeEach(function () {
    cy.fixture("compare_data1.txt").as("text1");
    cy.fixture("compare_data2.txt").as("text2");
  });

  describe('same', () => {
    it('paste', () => {
      cy.get("@text1")
        .then((text) =>
          cy.paste(text))
        .waitInput();

      cy.get("@text1")
        .then((text) =>
          cy.paste(text, "right"));

      cy.waitUntil(() => cy.contains("没有差异"), {timeout: 1000});
    });

    it('drag-drop', () => {
      cy.dropFile("@text1")
        .wait(50);
      cy.dropFile("@text1", "right");
      cy.waitUntil(() => cy.contains("没有差异"), {timeout: 1000});
    });

    it('click button', () => {
      cy.editorType(`{ "foo": "adc" }`);
      cy.editorType(`{ "foo": "adc" }`, "right");
      cy.waitInput();

      cy.contains("比较")
        .first()
        .click()
        .wait(50);
      cy.waitUntil(() => cy.contains("没有差异"), {timeout: 1000});

      cy.contains("文本比较")
        .click()
        .wait(50);
      cy.waitUntil(() => cy.contains("没有差异"), {timeout: 1000});
    });
  });

  describe('exists diff', () => {
    it('paste', () => {
      cy.get("@text1")
        .then((text) =>
          cy.paste(text))
        .waitInput();

      cy.get("@text2")
        .then((text) =>
          cy.paste(text, "right"));

      cy.waitUntil(() => cy.contains(/-\d+\s*\+\d+/), {timeout: 1000});
    });

    it('drag-drop', () => {
      cy.dropFile("@text1")
        .waitInput();
      cy.dropFile("@text2", "right");
      cy.waitUntil(() => cy.contains(/-\d+\s*\+\d+/), {timeout: 1000});

      cy.contains("文本比较")
        .click()
        .wait(50);
      cy.waitUntil(() => cy.contains(/-\d+\s*\+\d+/), {timeout: 1000});
      cy.get(".diff-fill")
        .should('be.visible');
    });

    it('click button', () => {
      cy.editorType(`{ "foo": "a" }`);
      cy.editorType(`{ "foo": "b" }`, "right");
      cy.waitInput();

      cy.contains("比较")
        .click()
        .wait(50);
      cy.waitUntil(() => cy.contains(/-\d+\s*\+\d+/), {timeout: 1000});

      cy.contains("文本比较")
        .click()
        .wait(50);
      cy.waitUntil(() => cy.contains(/-\d+\s*\+\d+/), {timeout: 1000});
      cy.contains("进行文本比较");
      cy.get(".diff-fill")
        .should("not.exist");
    });
  });
});