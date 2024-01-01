import {Spin} from '@arco-design/web-react';

export default function Loading() {
  return <div className="z-10 h-screen flex items-center justify-center text-2xl">
    <Spin dot/>
  </div>;
}
