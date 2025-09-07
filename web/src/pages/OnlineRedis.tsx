import { AuthGuard } from "../guard/auth-guard";
export default function OnlineRedis() {
	return (
		<AuthGuard>
			<div>在线 Redis</div>
		</AuthGuard>
	);
}
