'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { GRADING_PARTS, ENGAGEMENT_INTEGRITY_RULE } from '@/lib/grading-rules';
import type { ScoreRange } from '@/lib/grading-rules';

function ScoreRow({ range, label, description }: ScoreRange) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-white/5 last:border-0">
      <span className="font-display font-bold text-primary w-14 text-right shrink-0 text-sm">
        {range}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-foreground/90 font-medium text-sm">{label}</span>
        <span className="text-muted-foreground text-sm"> — {description}</span>
      </div>
    </div>
  );
}

export function WelcomeRules() {
  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="part-a" className="w-full">
        <TabsList className="w-full bg-white/5 border border-white/[0.07]">
          {GRADING_PARTS.map((part) => (
            <TabsTrigger
              key={part.id}
              value={part.id}
              className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/30 text-xs sm:text-sm"
            >
              {part.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {GRADING_PARTS.map((part) => (
          <TabsContent key={part.id} value={part.id} className="mt-3">
            <div className="glass-inner p-4">
              <h3 className="font-display font-bold text-lg text-foreground mb-1">
                {part.title}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {part.description}
              </p>

              <Accordion type="single" collapsible className="w-full">
                {part.criteria.map((criterion) => (
                  <AccordionItem
                    key={criterion.number}
                    value={`criterion-${criterion.number}`}
                    className="border-white/5"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/15 text-primary font-display font-bold text-xs shrink-0">
                          {criterion.number}
                        </span>
                        <span className="font-display font-semibold text-foreground/90">
                          {criterion.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] text-muted-foreground border-white/10 hidden sm:inline-flex"
                        >
                          {criterion.frequency}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pl-10">
                      {criterion.ranges.map((range) => (
                        <ScoreRow key={range.range} {...range} />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Engagement Integrity Rule */}
      <div className="glass-inner p-4 flex gap-3 items-start">
        <span className="text-lg shrink-0 mt-0.5">⚠️</span>
        <div>
          <h4 className="font-display font-bold text-sm text-foreground mb-1">
            {ENGAGEMENT_INTEGRITY_RULE.title}
          </h4>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {ENGAGEMENT_INTEGRITY_RULE.description}
          </p>
        </div>
      </div>
    </div>
  );
}
