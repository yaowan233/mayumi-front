import {Button} from "@nextui-org/button";
import {Link} from "@nextui-org/link";

export default function TournamentManagementPage() {
	return (
		<div>
			<Button as={Link} href="/create-tournament">创建比赛</Button>
		</div>
	);
}
