import { Layout } from "antd";
import { Sidebar } from "./component/sidebar.tsx";
import { Navigate, Route, Routes } from "react-router-dom";
import { routes } from "./data/route.tsx";

const { Sider, Content } = Layout;

export const App = () => {
	return (
		<Layout className="min-h-screen">
			<Sider
				width={280}
				theme="light"
				className="overflow-auto h-screen fixed left-0 top-0 bottom-0"
			>
				<Sidebar />
			</Sider>
			<Layout className="ml-[280px]">
				<Content className="p-6 min-h-screen bg-gray-50">
					<Routes>
						<Route path="/" element={<Navigate to="/home" replace />} />
						{routes.map((route) => (
							<Route key={route.key} path={route.key as string} element={route.component} />
						))}
					</Routes>
				</Content>
			</Layout>
		</Layout>
	);
};

export default App;
