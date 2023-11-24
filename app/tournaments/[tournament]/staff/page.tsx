import {Card, CardBody, CardHeader} from "@nextui-org/card";
import {Link} from "@nextui-org/link";
import {Image} from "@nextui-org/image";

export default async function StaffPage({params}: { params: { tournament: string } }) {
    // let staff = await GetStaff(params.tournament)
    let staff : Staff = {
        '直播': [
            {
                name: '123qsedafsdf',
                osu_id: '3162675',
            },
            {
                name: 'asdsdfgsdf',
                osu_id: '6237768',
            },
        ],
        '裁判': [
            {
                name: 'asdas dasd as',
                osu_id: '16891746',
            },
            {
                name: 'aaaa asdads',
                osu_id: '10286018',
            },
            {
                name: 'ddddddddddda',
                osu_id: '3162675',
            },
            {
                name: 'sadqwedasdb',
                osu_id: '6237768',
            },
            {
                name: 'aasdasdasd',
                osu_id: '3162675',
            },
            {
                name: 'asdasdqweqwe qas',
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
                                        <Link className={"grid grid-cols-1 border-2"} key={staff.osu_id} href={`https://osu.ppy.sh/users/${staff.osu_id}`} target='_blank'>
                                            <div className="flex justify-center">
                                                <Image className={""} width={60} height={60} src={`https://a.ppy.sh/${staff.osu_id}`}/>
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