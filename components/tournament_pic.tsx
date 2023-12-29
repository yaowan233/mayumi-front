'use client'
import {useState} from "react";
import {Link} from "@nextui-org/link";
import {Image} from "@nextui-org/image";
import {Card, CardFooter, CardHeader} from "@nextui-org/card";

export interface Tournament {
    name: string;
    abbreviation: string;
    description: string;
    start_date: string;
    end_date: string;
    pic_url: string;
}

export const TournamentComponent = ({tournament}: { tournament: Tournament }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };
    let tournament_href = "/tournaments/" + tournament.abbreviation + "/home"
    return (
        <Link
            key={tournament.name}
            className="items-center justify-center"
            href={tournament_href}
        >
        <div
            className="relative flex-auto"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Card>
                <CardHeader className="absolute z-10 top-0 flex items-center justify-center text-center text-xl font-bold bg-clip-content bg-black/30">
                    {isHovered ? tournament.name : tournament.abbreviation}
                </CardHeader>

                <Image
                    className="z-0 w-full h-[180px] object-cover"
                    width="100%"
                    src={tournament.pic_url}
                    alt={tournament.name}
                />
                <CardFooter
                    className={`absolute z-10 bottom-0 opacity-0 ${
                        isHovered ? 'opacity-100' : ''
                    } transition-opacity duration-300  bg-clip-content bg-black/30`}
                >
                    {tournament.description}
                </CardFooter>
            </Card>
        </div>
        </Link>
    );
};
