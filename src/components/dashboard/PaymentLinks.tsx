import { Copy, ExternalLink, MoreHorizontal } from "lucide-react";

const links = [
  { name: "Premium Course", url: "pay.flow/s/premium-course", clicks: 2340, earned: "$8,420", status: "Active" },
  { name: "Consultation Fee", url: "pay.flow/s/consult", clicks: 892, earned: "$4,460", status: "Active" },
  { name: "Digital Ebook", url: "pay.flow/s/ebook-v2", clicks: 5621, earned: "$14,053", status: "Active" },
];

const PaymentLinks = () => {
  return (
    <div className="bg-card rounded-2xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground text-sm md:text-base">Active Payment Links</h3>
        <button className="text-sm text-primary font-medium">+ New Link</button>
      </div>
      <div className="space-y-3">
        {links.map((link) => (
          <div key={link.name} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-lg">
              🔗
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{link.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{link.url}</p>
            </div>
            <div className="hidden sm:block text-right mr-2">
              <p className="text-sm font-semibold text-foreground">{link.earned}</p>
              <p className="text-[11px] text-muted-foreground">{link.clicks} clicks</p>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentLinks;
