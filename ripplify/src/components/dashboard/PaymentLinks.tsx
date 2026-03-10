import { Copy, ExternalLink, MoreHorizontal, Share2, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { fetchWithAuth } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PaymentLinks = () => {
  const { links, refreshData } = useAppContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCopy = (slug: string) => {
    const url = `${window.location.origin}/pay/${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Payment link has been copied to your clipboard.",
    });
  };

  const handleShare = (link: any) => {
    const url = `${window.location.origin}/pay/${link.slug}`;
    if (navigator.share) {
      navigator.share({
        title: link.name,
        text: `Pay for ${link.name} here:`,
        url: url,
      }).catch(() => {
        handleCopy(link.slug);
      });
    } else {
      handleCopy(link.slug);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetchWithAuth(`/links/${id}`, { method: 'DELETE' });
      await refreshData();
      toast({
        title: "Link deleted",
        description: "The payment link has been removed.",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleStatus = async (link: any) => {
    try {
      const newStatus = link.status === "Active" ? "Inactive" : "Active";
      await fetchWithAuth(`/links/${link.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      await refreshData();
      toast({
        title: "Status updated",
        description: `Link is now ${newStatus}.`,
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const recentLinks = links.slice(0, 5);

  return (
    <div className="bg-card rounded-2xl p-4 md:p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground text-sm md:text-base">Active Payment Links</h3>
        <button
          onClick={() => navigate("/payment-links")}
          className="text-sm text-primary font-medium hover:underline"
        >
          View All
        </button>
      </div>
      <div className="space-y-3">
        {recentLinks.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">No active links.</div>
        ) : (
          recentLinks.map((link) => (
            <div key={link.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-lg">
                🔗
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{link.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${link.status === "Active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {link.status}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{window.location.origin}/pay/{link.slug}</p>
              </div>
              <div className="hidden sm:block text-right mr-2">
                <p className="text-sm font-semibold text-foreground">{link.currency} {link.price.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">{link.clicks} clicks</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopy(link.slug)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title="Copy Link"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleShare(link)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title="Share Link"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/payment-links`)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Manage Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(`/pay/${link.slug}`, "_blank")}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Preview Page
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleStatus(link)}>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${link.status === "Active" ? "bg-red-500" : "bg-green-500"}`} />
                        {link.status === "Active" ? "Deactivate" : "Activate"}
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(link.id)} className="text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PaymentLinks;
