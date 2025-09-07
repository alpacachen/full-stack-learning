import { Modal, Form, Input, Alert, Typography, Space, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { logInWithEmail, signUpWithEmail } from "../utils/supbase";

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

	const handleOk = async () => {
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
				message.info("注册成功，请前往邮箱完成验证");
			}
			onClose();
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
		<Modal title={title} open={open} onOk={handleOk} onCancel={onClose} okButtonProps={{ loading: submitting }} destroyOnHidden>
			{error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} /> : null}
			<Form form={form} layout="vertical">
				<Form.Item
					name="email"
					label="邮箱"
					rules={[
						{ required: true, message: "请输入邮箱" },
						{ type: "email", message: "邮箱格式不正确" },
					]}
				>
					<Input placeholder="you@example.com" autoComplete="email" />
				</Form.Item>
				<Form.Item name="password" label="密码" rules={[{ required: true, message: "请输入密码" }]}>
					<Input.Password placeholder="••••••••" autoComplete="current-password" />
				</Form.Item>
				{!isLogin ? (
					<Form.Item name="confirm" label="确认密码" rules={[{ required: true, message: "请再次输入密码" }]}>
						<Input.Password placeholder="再次输入密码" autoComplete="new-password" />
					</Form.Item>
				) : null}
			</Form>
			<Space size={8} style={{ marginTop: 8 }}>
				<Typography.Text type="secondary">{isLogin ? "还没有账号？" : "已经有账号？"}</Typography.Text>
				<Typography.Link
					onClick={() => {
						setMode(isLogin ? "signup" : "login");
						setError(null);
						form.resetFields();
					}}
				>
					{isLogin ? "去注册" : "去登录"}
				</Typography.Link>
			</Space>
		</Modal>
	);
};
