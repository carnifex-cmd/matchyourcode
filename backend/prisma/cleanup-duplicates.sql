-- Delete duplicate problems keeping only the first occurrence of each leetcodeId
DELETE FROM "Problem"
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY "leetcodeId" ORDER BY id) as rnum
        FROM "Problem"
        WHERE "leetcodeId" IS NOT NULL
    ) t
    WHERE t.rnum > 1
);