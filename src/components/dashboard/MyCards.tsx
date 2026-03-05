const MyCards = () => {
  return (
    <div className="bg-card rounded-2xl p-5 w-[280px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">My Cards</h3>
        <button className="text-sm text-primary font-medium">See All →</button>
      </div>
      {/* Visa Card */}
      <div className="rounded-xl p-5 text-primary-foreground relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(170 50% 25%), hsl(162 63% 35%))" }}
      >
        <div className="flex items-center justify-between mb-8">
          <span className="text-sm font-bold tracking-widest opacity-90">VISA</span>
          <span className="text-xs opacity-70">**** **** **** 2104</span>
        </div>
        <div>
          <p className="text-2xl font-bold">€ 4.540,20</p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full border border-primary-foreground/10" />
        <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full border border-primary-foreground/10" />
      </div>
    </div>
  );
};

export default MyCards;
