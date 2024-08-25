// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
import 'cypress-wait-until';

Cypress.Commands.add(
  'paste',
  {prevSubject: 'optional'},
  (subject, text, side = "left") => {
    return cy.editorRef(side).then((editor) => editor.onPaste(text));
  },
);

Cypress.Commands.add('visitHome', {prevSubject: 'optional'}, (subject) => {
  cy.visit("/");
  return cy.get('.monaco-editor', {timeout: 5000}).should('be.visible');
});

Cypress.Commands.add('editor', {prevSubject: 'optional'}, (subject, side = "left") => {
  let editor;
  if (side === "right") {
    editor = cy.get('.monaco-editor').last();
  } else {
    editor = cy.get('.monaco-editor').first();
  }
  return editor;
});

Cypress.Commands.add('editorRef', {prevSubject: 'optional'}, (subject, side = "left") => {
  return cy.window().then((win) => cy.wrap(side === "right" ? win.rightEditor : win.leftEditor));
});

Cypress.Commands.add('editorText', {prevSubject: 'optional'}, (subject, side = "left") => {
  return cy.editorRef(side).then((editor) => cy.wrap(editor.text()));
});

Cypress.Commands.add('editorType', {prevSubject: 'optional'}, (subject, input, side = "left", parseSpecialCharSequences = false) => {
  let editor = cy.editor(side).get(".inputarea");

  if (side === "right") {
    editor = editor.last();
  } else {
    editor = editor.first();
  }

  return editor.focus()
    .type(input, {
      parseSpecialCharSequences: parseSpecialCharSequences,
      delay: 0,
    });
});

Cypress.Commands.add('waitInput', {prevSubject: 'optional'}, (subject, side = "left") => {
  return cy.waitUntil(() => {
    let editor = cy.get('.view-lines');
    editor = side === "right" ? editor.last() : editor.first();
    return editor.invoke('text').should('have.length.greaterThan', 0);
  }, {
    timeout: 1000,
  });
});

Cypress.Commands.add('dropFile', {prevSubject: 'optional'}, (subject, alias, side = "left") => {
  cy.editor(side)
    .click()
    .selectFile(alias, {action: 'drag-drop'});
  cy.waitInput(side);
});

Cypress.Commands.add('getSetting', {prevSubject: 'optional'}, (subject, key) => {
  return cy.getAllLocalStorage().then((kv) => {
    return cy.location("origin").then((origin) => {
      try {
        const s = kv[origin]["persist:root"];
        const root = JSON.parse(s);
        const settings = JSON.parse(root["settings"]);
        return cy.wrap(settings[key]);
      } catch {
        return cy.wrap(undefined);
      }
    });
  });
});
