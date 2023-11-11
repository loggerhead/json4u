import {Spin} from '@arco-design/web-react';

export default function Loading({height}) {
  return (
    <div className="flex items-center justify-center text-2xl" style={{height: height}}>
      <Spin dot/>
    </div>
  );
}
