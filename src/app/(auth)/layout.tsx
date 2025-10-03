export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex flex-col max-w-md h-screen md:items-center md:justify-center px-3 md:px-0 pt-12 md:-mt-10 md:pt-0">
      <div className={"w-full"}>{children}</div>
    </div>
  );
}
