import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface FeedbackPanelProps {
  feedback: string;
}

export default function FeedbackPanel({ feedback }: FeedbackPanelProps) {
  return (
    <Card className="w-full min-h-[300px] md:min-h-[350px] lg:h-[400px]">
      <CardContent className="h-full p-0">
        <ScrollArea className="h-full">
          <div className="p-6 w-full text-foreground whitespace-pre-line leading-relaxed break-words">
            {feedback ? (
              feedback
            ) : (
              <span className="text-muted-foreground italic">
                No feedback yet.
              </span>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 