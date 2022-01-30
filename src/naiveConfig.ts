import {
  create,
  NInput,
  NButton,
  NAlert,
  NTooltip,
  NSpace,
  NGrid,
  NGi,
  NLayout,
  NProgress,
  NLayoutContent,
  NLayoutHeader,
  NLayoutFooter,
} from "naive-ui";

const naive = create({
  components: [
    NInput,
    NButton,
    NAlert,
    NTooltip,
    NSpace,
    NGrid,
    NGi,
    NProgress,
    NLayout,
    NLayoutContent,
    NLayoutHeader,
    NLayoutFooter,
  ],
});

export function setupNaive(app: any) {
  app.use(naive);
}
