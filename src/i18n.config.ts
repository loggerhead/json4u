import { App } from "vue";
import { createI18n } from "vue-i18n";

const messages = {
  zh: {
    msg: {
      compare: "比较",
      pretty: "格式化",
      minify: "最小化",
      leftPlaceholder: "在这里粘贴 JSON",
      rightPlaceholder: "在这里粘贴 JSON",
      syncScroll: "同步滚动",
      prev: "前一个",
      next: "后一个",
      nodiff: "两边没有差异",
    },
  },
  en: {
    msg: {
      compare: "Compare",
      pretty: "Pretty",
      minify: "Minify",
      leftPlaceholder: "Paste your JSON here",
      rightPlaceholder: "Paste your JSON here",
      syncScroll: "Sync scroll",
      prev: "Previous",
      next: "Next",
      nodiff: "There is no difference between left and right",
    },
  },
};

const lang = navigator.language || (navigator as any).userLanguage;
const i18n = createI18n({
  locale: lang.split("-")[0],
  fallbackLocale: "en",
  messages,
});

export default function setup(app: App<Element>) {
  app.use(i18n);
}
