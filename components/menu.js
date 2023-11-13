import {Button, Divider, Dropdown, Menu} from '@arco-design/web-react';
import {IconMore} from '@arco-design/web-react/icon';
import {getLastEditor} from './helper';

export function LeftMenu({leftEditorRef, rightEditorRef}) {
  const onClick = (key, event, keyPath) => {
    try {
      const editor = getLastEditor(leftEditorRef, rightEditorRef);
      editor[key]();
    } catch (e) {
      console.error(e);
    }
  };

  const dropList = (
    <Menu onClickMenuItem={onClick} style={{maxHeight: "400px"}}>
      <Menu.Item key="escape">转义</Menu.Item>
      <Menu.Item key="unescape">去转义</Menu.Item>
      <Divider style={{margin: '4px 0'}}/>
      <Menu.Item key="sort">排序（升序）</Menu.Item>
      <Menu.Item key="sortReverse">排序（降序）</Menu.Item>
      <Divider style={{margin: '4px 0'}}/>
      <Menu.Item key="urlToJSON">URL 转 JSON</Menu.Item>
      <Menu.Item key="pythonDict2JSON">Python Dict 转 JSON</Menu.Item>
    </Menu>
  );

  return <div>
    <Dropdown droplist={dropList} trigger="click">
      <Button size="mini" icon={<IconMore/>}/>
    </Dropdown>
  </div>;
}

