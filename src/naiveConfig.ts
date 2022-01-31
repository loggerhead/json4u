import {
  create,
  NButton,
  NAlert,
  NTooltip,
  NLayout,
  NLayoutHeader,
  NLayoutFooter,
} from "naive-ui";

const naive = create({
  components: [
    NButton,
    NAlert,
    NTooltip,
    NLayout,
    NLayoutHeader,
    NLayoutFooter,
  ],
});

export function setupNaive(app: any) {
  app.use(naive);
}
