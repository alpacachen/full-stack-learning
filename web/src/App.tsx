import { Col, Row } from "antd";
import { Sidebar } from "./component/sidebar.tsx";
import { Navigate, Route, Routes } from "react-router-dom";
import { routes } from "./data/route.tsx";
import { UserSessionProvider } from "./context/user-session.ts";
import { AuthCallback } from "./pages/AuthCallback.tsx";

export const App = () => {
	return (
		<UserSessionProvider>
			<Row className="h-full">
				<Col span={4}>
					<Sidebar />
				</Col>
				<Col span={20}>
					<Routes>
						<Route path="/" element={<Navigate to="/home" replace />} />
						<Route path="/auth/callback" element={<AuthCallback />} />
						{routes.map((route) => (
							<Route key={route.key} path={route.key as string} element={route.component} />
						))}
					</Routes>
				</Col>
			</Row>
		</UserSessionProvider>
	);
};

export default App;
