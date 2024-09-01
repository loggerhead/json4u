import LinkButton from "@/components/LinkButton";
import Typography from "@/components/ui/typography";
import { ThumbsUp, UserRoundPlus, JapaneseYen } from "lucide-react";
import { LucideIcon } from "lucide-react";

export default function Description() {
  return (
    <div className="flex flex-col items-center justify-center mx-auto mt-4 max-w-md gap-2 lg:mx-0 lg:max-w-none">
      <Typography className="w-full">
        {"网站是"}
        <span className="font-semibold">{"免费"}</span>
        {
          "提供给大家使用的，也没有广告，但是网站运营有成本（包括 CDN、服务器费用以及投入的时间精力）。所以如果你觉得这个网站对你有帮助，有提升你的工作效率，可以给个免费的好评或关注。如果你觉得非常好用，想支持一下网站的日常运维，也可以打赏。"
        }
      </Typography>
      <Typography className="w-full">{"你的支持对我来说非常重要，是我持续迭代和优化的动力！"}</Typography>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Btn text="好评" href="https://www.trustpilot.com/review/json4u.com" Icon={ThumbsUp} />
        <Btn text="关注" href="https://weibo.com/loggerhead" Icon={UserRoundPlus} />
        <Btn text="打赏" href="https://mbd.pub/o/loggerhead/work" Icon={JapaneseYen} />
      </div>
    </div>
  );
}

interface BtnProps {
  Icon: LucideIcon;
  href: string;
  text: string;
}

function Btn({ Icon, href, text }: BtnProps) {
  return (
    <LinkButton newWindow variant="icon-outline" href={href}>
      <div className="flex items-center justify-center gap-1 text-sm">
        <Icon className="icon" />
        <span>{text}</span>
      </div>
    </LinkButton>
  );
}
