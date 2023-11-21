import {Card, CardBody, CardHeader} from "@nextui-org/card";
import {Link} from "@nextui-org/link";
import {Image} from "@nextui-org/image";

export default async function StaffPage({params}: { params: { tournament: string } }) {
    // let staff = await GetStaff(params.tournament)
    let staff : Staff = {
        '直播': [
            {
                name: 'a',
                osu_id: '3162675',
            },
            {
                name: 'b',
                osu_id: '6237768',
            },
        ],
        '裁判': [
            {
                name: 'c',
                osu_id: '16891746',
            },
            {
                name: 'd',
                osu_id: '10286018',
            },
            {
                name: 'a',
                osu_id: '3162675',
            },
            {
                name: 'b',
                osu_id: '6237768',
            },
            {
                name: 'a',
                osu_id: '3162675',
            },
            {
                name: 'b',
                osu_id: '6237768',
            },
        ],
    }
    return (
        <div className="grid grid-cols-2 gap-6">
            {/*遍历 staff*/}
            {Object.keys(staff).map((role) => (
                <Card>
                    <CardHeader>
                        <h1>
                            {role}
                        </h1>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-4 gap-4">
                            {staff[role].map((staff) => (
                                    <div className="border-2">
                                        <Link key={staff.osu_id} href={`https://osu.ppy.sh/users/${staff.osu_id}`} target='_blank'>
                                            <div className="grid-rows-2">
                                        <Image className={""} width={60} height={60} src={`https://a.ppy.sh/${staff.osu_id}`}/>
                                        <p className="text-center">
                                            {staff.name}
                                        </p>
                                        </div>
                                        </Link>
                                    </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            ))}
        </div>
    )
}

async function GetStaff(tournament: string) : Promise<Staff> {
    const res = await fetch('http://127.0.0.1:8421/api/satff?tournament=' + tournament,
        { next: { revalidate: 0 }})
    if (!res.ok) {
        throw new Error('Failed to fetch data')
    }
    return await res.json()
}

interface Staff{
    [role: string]: {
        name: string,
        osu_id: string,
    }[]
}