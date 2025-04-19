import {Card, CardBody, CardHeader} from "@heroui/card";
import {Link} from "@heroui/link";
import {Image} from "@heroui/image";
import {siteConfig} from "@/config/site";

export default async function StaffPage(props: { params: Promise<{ tournament: string }> }) {
    const params = await props.params
    let staff = await GetStaff(params.tournament)
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/*遍历 staff*/}
            {Object.keys(staff).filter((member) => staff[member].length > 0).map((role) => (
                <Card key={role}>
                    <CardHeader className={"p-2 text-center text-4xl justify-center"}>
                        {role}
                    </CardHeader>
                    <CardBody className={"pt-0"}>
                        <div className="flex flex-row justify-center gap-2 flex-wrap">
                            {staff[role].map((staff) => (
                                <Link isExternal color={"foreground"} className={"grid grid-cols-1 border-2 p-2 min-w-[130px] shadow-large"} key={staff.uid} href={`https://osu.ppy.sh/users/${staff.uid}`}>
                                    <div className="flex justify-center">
                                        <Image alt="icon" width={60} height={60} src={`https://a.ppy.sh/${staff.uid}`}/>
                                    </div>
                                    <div className="flex justify-center">
                                        {staff.name}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            ))}
        </div>
    )
}

async function GetStaff(tournament: string) : Promise<Staff> {
    const res = await fetch(siteConfig.backend_url + '/api/staff' +
        '?tournament_name=' + tournament,
        { next: { revalidate: 60 }})
    if (!res.ok) {
        throw new Error('Failed to fetch data')
    }
    return await res.json()
}

interface Staff{
    [role: string]: {
        name: string,
        uid: string,
    }[]
}
