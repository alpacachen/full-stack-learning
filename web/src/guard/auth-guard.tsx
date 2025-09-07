import { Button, Empty } from "antd";
import { useUserSession } from "../context/user-session";
import { AuthDialog } from "../component/auth-dialiog";
import { useState } from "react";
export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
	const { session } = useUserSession();
	const [dialogOpen, setDialogOpen] = useState(false);
	if (!session) {
		return (
			<div className="flex justify-center items-center h-full">
				<AuthDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
				<Empty
					description={
						<>
							此功能需要
							<Button type="link" className="px-0" onClick={() => setDialogOpen(true)}>
								登录
							</Button>
							后使用
						</>
					}
				/>
			</div>
		);
	}
	return <>{children}</>;
};
