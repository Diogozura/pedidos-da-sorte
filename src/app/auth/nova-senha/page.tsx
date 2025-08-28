import NovaSenhaClient from "./NovaSenhaClient";


type PageProps = {
    // Next 15 pode entregar searchParams como Promise
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async  function Page({ searchParams }: PageProps) {
    const params = (await searchParams) ?? {};
    const raw = params.oobCode;
    const oobCode = typeof raw === 'string' ? raw : '';
    return (
        <>

            <NovaSenhaClient oobCode={oobCode} />;
        </>
    )


}
