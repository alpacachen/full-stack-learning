import { CodeSandboxOutlined } from "@ant-design/icons";
import type { MenuItemType } from "antd/es/menu/interface";
import { OnlineRedis } from "../pages/OnlineRedis";
import OnlineMysql from "../pages/OnlineMysql";
import Home from "../pages/Home";
import JsonlToExcel from "../pages/JsonlToExcel";

export type RouteToken = "home" | "jsonl-to-excel" | "online-redis" | "online-mysql";

export const routes: (Pick<MenuItemType, "label" | "key" | "icon"> & { component: React.ReactNode })[] = [
	{ label: "Home", key: "home", icon: <CodeSandboxOutlined />, component: <Home /> },
	{ label: "JSONL 转 Excel", key: "jsonl-to-excel", component: <JsonlToExcel /> },
	{ label: "在线 Redis", key: "online-redis", component: <OnlineRedis /> },
	{ label: "在线 MySQL", key: "online-mysql", component: <OnlineMysql /> },
];
