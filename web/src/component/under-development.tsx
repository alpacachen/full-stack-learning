import { Flex } from "antd";
import { ToolOutlined } from "@ant-design/icons";

export const UnderDevelopment: React.FC = () => {
	return (
		<Flex vertical align="center" justify="center" className="py-20">
			<ToolOutlined className="text-6xl text-gray-400 mb-4" />
			<span className="text-xl text-gray-500">开发中</span>
		</Flex>
	);
};