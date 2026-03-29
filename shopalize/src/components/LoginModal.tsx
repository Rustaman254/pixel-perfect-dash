import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Sign In Required</DialogTitle>
          <DialogDescription>
            Please sign in to create and manage your stores.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button className="w-full h-12 text-base" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button variant="outline" className="w-full h-12 text-base" onClick={() => navigate('/signup')}>
            Create Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
