'use client'
import {useState} from "react";
import {Link} from "@heroui/link";
import {Image} from "@heroui/image";
import {Card, CardFooter, CardHeader} from "@heroui/card";

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
        <Card onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} as={Link}
              className="items-center justify-center min-w-[200px] min-h-[180px]" href={tournament_href}>
            <CardHeader
                className="absolute z-10 top-0 flex items-center justify-center text-center text-xl font-bold bg-clip-content dark:bg-black/30 bg-black/50 text-gray-50">
                {isHovered ? tournament.name : tournament.abbreviation}
            </CardHeader>

            <Image
                className="z-0 w-full h-[180px] object-cover"
                width="100%"
                src={tournament.pic_url ? tournament.pic_url : undefined}
                alt={tournament.name}
            />
            <CardFooter
                className={`absolute z-10 bottom-0 opacity-0 ${
                    isHovered ? 'opacity-100' : ''
                } transition-opacity duration-300  bg-clip-content dark:bg-black/30 bg-black/50 text-gray-50`}
            >
                {tournament.description}
            </CardFooter>
        </Card>
    );
};
