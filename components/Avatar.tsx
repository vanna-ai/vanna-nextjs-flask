import Image from "next/image";

type AvatarProps = {
  path: string;
  alt: string;
  className: string;
};
const Avatar: React.FC<AvatarProps> = (props: AvatarProps) => {
  const { path, alt, className } = props;
  return (
    <div className="h-7 w-7 rounded-full border-2 flex items-center justify-center bg-white">
      <Image
        className={`rounded-full p-0 m-0 ${className}`}
        alt={alt}
        src={path}
        width={40}
        height={40}
        priority
      />
    </div>
  );
};

export default Avatar;
