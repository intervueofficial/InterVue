const Loading = () => {
  return (
    <div className="space-y-4">

      {[1,2,3,4,5].map((item)=>(
        <div
          key={item}
          className="h-16 rounded-xl bg-slate-200 animate-pulse"
        />
      ))}

    </div>
  );
};

export default Loading;