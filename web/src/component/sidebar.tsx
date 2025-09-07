import { Button, Flex, Menu } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { routes } from "../data/route";
import { LogoutOutlined } from "@ant-design/icons";
import { logOut } from "../utils/supbase";
import { useUserSession } from "../context/user-session";

export const Sidebar = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const selected = location.pathname.split("/")[1] || "home";
	const { session } = useUserSession();
	const handleLogout = async () => {
		await logOut();
	};

	return (
		<Flex vertical className="h-full">
			<Menu
				style={{ flex: 1 }}
				items={routes.map((route) => ({
					key: route.key,
					label: route.label,
					icon: route.icon,
				}))}
				selectedKeys={[selected]}
				onClick={({ key }) => {
					navigate(`/${key}`);
				}}
			/>
			{session ? (
				<div style={{ padding: 12 }}>
					<Button danger icon={<LogoutOutlined />} block onClick={handleLogout}>
						退出登录
					</Button>
				</div>
			) : undefined}
		</Flex>
	);
};
