export default function Footer() {
    return (
        <footer className="border-t border-border bg-background px-6 py-6 flex items-center justify-between">
            <span className="text-xs text-muted-foreground select-none">
                © {new Date().getFullYear()} Markify · All rights reserved
            </span>
            
            <div className="flex gap-4 mr-3">
                {["Help", "Privacy", "Terms"].map((label) => (
                    <span key={label} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                        {label}
                    </span>
                ))}
            </div>
        </footer>
    );
}