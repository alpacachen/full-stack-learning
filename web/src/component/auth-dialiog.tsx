import { Modal, Form, Input, Alert, Typography, message, Button, Divider } from "antd";
import { GithubOutlined, MailOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { logInWithEmail, signUpWithEmail, signInWithGitHub } from "../utils/supbase";

type AuthDialogProps = {
	open: boolean;
	onClose: () => void;
};

export const AuthDialog = ({ open, onClose }: AuthDialogProps) => {
	const [form] = Form.useForm<{ email: string; password: string; confirm?: string }>();
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [mode, setMode] = useState<"login" | "signup">("login");

	const isLogin = mode === "login";

	const title = useMemo(() => (isLogin ? "登录" : "注册"), [isLogin]);

	const handleEmailAuth = async () => {
		try {
			setError(null);
			const values = await form.validateFields();
			setSubmitting(true);
			let errorMessage: string | null = null;
			if (isLogin) {
				const { error } = await logInWithEmail(values.email, values.password);
				if (error) errorMessage = error.message;
			} else {
				if (values.password !== values.confirm) {
					errorMessage = "两次输入的密码不一致";
				} else {
					const { error } = await signUpWithEmail(values.email, values.password);
					if (error) errorMessage = error.message;
				}
			}
			if (errorMessage) {
				setError(errorMessage);
				return;
			}
			if (!isLogin) {
				message.info("注册成功，请前往邮箱完成验证，然后从新登录");
			}
			onClose();
		} finally {
			setSubmitting(false);
		}
	};

	const handleGitHubAuth = async () => {
		try {
			setError(null);
			setSubmitting(true);
			const { error } = await signInWithGitHub();
			if (error) {
				setError(error.message);
			} else {
				onClose();
			}
		} catch {
			setError("GitHub登录失败，请重试");
		} finally {
			setSubmitting(false);
		}
	};

	useEffect(() => {
		if (open) {
			setError(null);
		}
	}, [open]);

	return (
		<Modal
			title={title}
			open={open}
			onCancel={onClose}
			footer={null}
			width={400}
			style={{ maxWidth: '90vw' }}
			styles={{
				body: { padding: '24px' }
			}}
			destroyOnHidden
		>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				{error ? <Alert type="error" showIcon message={error} /> : null}

				{/* GitHub登录按钮 */}
				<Button
					type="default"
					icon={<GithubOutlined />}
					size="large"
					onClick={handleGitHubAuth}
					loading={submitting}
					block
					style={{
						height: '48px',
						fontSize: '16px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center'
					}}
				>
					使用 GitHub 登录
				</Button>

				<Divider style={{ margin: '16px 0' }}>
					<Typography.Text type="secondary">或者</Typography.Text>
				</Divider>

				{/* 邮箱登录表单 */}
				<Form form={form} layout="vertical" onFinish={handleEmailAuth}>
					<Form.Item
						name="email"
						label="邮箱"
						rules={[
							{ required: true, message: "请输入邮箱" },
							{ type: "email", message: "邮箱格式不正确" },
						]}
					>
						<Input
							prefix={<MailOutlined />}
							placeholder="you@example.com"
							autoComplete="email"
							size="large"
						/>
					</Form.Item>
					<Form.Item name="password" label="密码" rules={[{ required: true, message: "请输入密码" }]}>
						<Input.Password
							placeholder="••••••••"
							autoComplete="current-password"
							size="large"
						/>
					</Form.Item>
					{!isLogin ? (
						<Form.Item name="confirm" label="确认密码" rules={[{ required: true, message: "请再次输入密码" }]}>
							<Input.Password
								placeholder="再次输入密码"
								autoComplete="new-password"
								size="large"
							/>
						</Form.Item>
					) : null}
					<Form.Item style={{ marginBottom: '16px' }}>
						<Button
							type="primary"
							htmlType="submit"
							loading={submitting}
							block
							size="large"
							style={{ height: '48px', fontSize: '16px' }}
						>
							{title}
						</Button>
					</Form.Item>
				</Form>

				{/* 切换登录/注册模式 */}
				<div style={{ textAlign: 'center' }}>
					<Typography.Text type="secondary">{isLogin ? "还没有账号？" : "已经有账号？"}</Typography.Text>
					<Typography.Link
						onClick={() => {
							setMode(isLogin ? "signup" : "login");
							setError(null);
							form.resetFields();
						}}
						style={{ marginLeft: '8px' }}
					>
						{isLogin ? "去注册" : "去登录"}
					</Typography.Link>
				</div>
			</div>
		</Modal>
	);
};
