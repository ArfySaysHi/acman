interface Props {
  connected: boolean;
}

const Header = ({ connected }: Props) => {
  return (
    <div className="flex justify-between items-center mb-2">
      <h1 className="text-lg font-bold">AzerothCore Console</h1>
      <span
        className={`text-sm flex items-center gap-2 ${connected ? "bg-green-400" : "bg-red-400"}`}
      >
        <span
          className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`}
        ></span>
        {connected ? "Connected" : "Disconnected"}
      </span>
    </div>
  );
};

export default Header;
