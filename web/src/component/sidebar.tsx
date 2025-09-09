import { Button, Flex, Menu, Typography, Divider } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { routes } from "../data/route";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { logOut } from "../utils/supbase";
import { useUserSession } from "../context/user-session";

const { Title, Text } = Typography;

export const Sidebar = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const selected = location.pathname.split("/")[1] || "home";
	const { session } = useUserSession();
	
	const handleLogout = async () => {
		await logOut();
	};

	return (
		<Flex vertical className="h-full py-4">
			{/* Logo/Title Section */}
			<div className="px-4 pb-4">
				<Title level={4} className="m-0 text-center text-blue-600">
					全栈学习平台
				</Title>
			</div>
			
			<Divider className="mt-0 mb-4" />

			{/* Navigation Menu */}
			<Menu
				mode="inline"
				className="flex-1 border-none bg-transparent"
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

			{/* User Section */}
			{session && (
				<>
					<Divider className="my-4" />
					<div className="px-4">
						<Flex align="center" gap={8} className="mb-3">
							<UserOutlined className="text-gray-600" />
							<Text type="secondary" ellipsis className="flex-1">
								{session.user?.email}
							</Text>
						</Flex>
						<Button 
							danger 
							icon={<LogoutOutlined />} 
							block 
							onClick={handleLogout}
							size="middle"
						>
							退出登录
						</Button>
					</div>
				</>
			)}
		</Flex>
	);
};
