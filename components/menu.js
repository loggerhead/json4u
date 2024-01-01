import {useSelector} from "react-redux";
import {Button, Divider, Dropdown, Menu} from '@arco-design/web-react';
import {IconMore} from '@arco-design/web-react/icon';
import {lastEditorSelector} from "@/lib/store";

// 放在左侧的菜单项
export function LeftMenu() {
  const lastEditor = useSelector(lastEditorSelector);
  const onClick = (key, event, keyPath) => {
    try {
      lastEditor[key]();
    } catch (e) {
      console.error(`call menu function "${key}" failed`, e);
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

  return <div id="leftMenu">
    <Dropdown droplist={dropList} trigger="click">
      <Button size="mini" icon={<IconMore/>}/>
    </Dropdown>
  </div>;
}

