// /**
//  * Register inlay hints provider for JSON language
//  */
// private registerInlayHintsProvider() {
//   this.monacoApi.languages.registerInlayHintsProvider("json", {
//     provideInlayHints: (model, range) => {
//       console.log(range);
//       return {
//         hints: [
//           {
//             position: { column: 16, lineNumber: 2 },
//             label: ": Number",
//           },
//         ],
//         dispose: () => {},
//       };
//     },
//   });
// }
