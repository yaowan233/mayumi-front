import {Navbar} from "@/components/navbar";

export default function NotFound() {
    return (
        <>
            <Navbar/>
            <div className="container mx-auto pt-20 grow justify-center text-center">
                {"没有这个页面哦>_<"}
            </div>
        </>
    )
}
