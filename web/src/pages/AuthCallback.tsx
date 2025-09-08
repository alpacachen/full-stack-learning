import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Spin, message } from "antd";
import { getSession } from "../utils/supbase";

export const AuthCallback = () => {
	const navigate = useNavigate();

	useEffect(() => {
		const handleAuthCallback = async () => {
			try {
				// 等待一下让 supabase 处理完 OAuth 回调
				await new Promise(resolve => setTimeout(resolve, 1000));
				
				const session = await getSession();
				if (session) {
					message.success("登录成功！");
					navigate("/home");
				} else {
					message.error("登录失败，请重试");
					navigate("/home");
				}
			} catch (error) {
				console.error("Auth callback error:", error);
				message.error("登录失败，请重试");
				navigate("/home");
			}
		};

		handleAuthCallback();
	}, [navigate]);

	return (
		<div style={{ 
			display: 'flex', 
			justifyContent: 'center', 
			alignItems: 'center', 
			height: '100vh',
			flexDirection: 'column',
			gap: '16px'
		}}>
			<Spin size="large" />
			<div>正在处理登录...</div>
		</div>
	);
};