import STLRoboticsLogo from "@/public/logos/Robotics_lion.svg";

export default function STLRoboticsLogoComponent({ width = 50, height = 50 }: { width?: number, height?: number }) {
    return <img     
    src={STLRoboticsLogo.src} 
    alt="STL Robotics Logo" 
    width={width} 
    height={height} 
  />
}