import { Flex, Menu, Typography, Divider } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { routes } from "../data/route";

const { Title } = Typography;

export const Sidebar = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const selected = location.pathname.split("/")[1] || "home";

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

		</Flex>
	);
};
