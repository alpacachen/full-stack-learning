import { AuthGuard } from "../guard/auth-guard";
export default function OnlineMysql() {
	return (
		<AuthGuard>
			<div>在线 MySQL</div>
		</AuthGuard>
	);
}
