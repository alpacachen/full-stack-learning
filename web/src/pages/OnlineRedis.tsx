import { useAsync } from "react-use";
import { AuthGuard } from "../guard/auth-guard";
import { useUserSession } from "../context/user-session";
function InnerOnlineRedis() {
	const { getWithAuth } = useUserSession();
	const { value } = useAsync(async () => getWithAuth('/test'));
	return (
		<AuthGuard>
			{value}
			<div>在线 Redis</div>
		</AuthGuard>
	);
}

export const OnlineRedis = () => {
	return (
		<AuthGuard>
			<InnerOnlineRedis />
		</AuthGuard>
	);
};