import { Box, Button, TextField } from '@mui/material';
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ReactComponent as AvatarBot } from './assets/avatar-bot.svg';
import { ReactComponent as AvatarMe } from './assets/avatar-me.svg';
import { ReactComponent as SendEnabled } from './assets/send-enabled.svg';

interface Round {
  user: string;
  bot: string;
}

function App() {
  const [isResponding, setIsResponding] = useState(false);
  const [session, setSession] = useState<Round[]>([]);
  const scrollContainerRef = useRef<{ scrollToBottom: () => void }>();

  const onSubmitPrompt = async (prompt: string) => {
    const round = {
      user: prompt,
      bot: '',
    };
    setSession([...session, round]);

    setIsResponding(true);

    await askAi(session, prompt, (answerPart: string) => {
      round.bot += answerPart;
      setSession((old) => [...old]);
      scrollContainerRef.current?.scrollToBottom();
    });

    setIsResponding(false);
  };

  const sessionComponent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        rowGap: '20px',
      }}
    >
      {session.map((item, index) => {
        return (
          <div key={index}>
            <ChatMessage isUser content={item.user} />
            <ChatMessage isUser={false} content={item.bot} />
          </div>
        );
      })}
    </div>
  );
  const promptComponent = (
    <PromptForm isResponding={isResponding} onSubmit={onSubmitPrompt} />
  );

  return (
    <ChatWindow
      ref={scrollContainerRef}
      sessionComponent={sessionComponent}
      promptComponent={promptComponent}
    />
  );
}

const ChatWindow = forwardRef(function ChatWindowComponent(
  {
    sessionComponent,
    promptComponent,
  }: { sessionComponent: ReactNode; promptComponent: ReactNode },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => {
    return {
      scrollToBottom: () => {
        containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
      },
    };
  });

  const chatWindowMaxWidth = '600px';

  return (
    <div
      style={{
        boxSizing: 'border-box',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        ref={containerRef}
        style={{
          flexGrow: '1',
          overflow: 'auto',
          padding: '0 2rem',
        }}
      >
        <div
          style={{
            minHeight: '100%',
            maxWidth: chatWindowMaxWidth,
            margin: 'auto',
          }}
        >
          {sessionComponent}
        </div>
      </div>
      <div
        style={{
          flexShrink: '0',
          flexGrow: '0',
        }}
      >
        <div
          style={{
            maxWidth: chatWindowMaxWidth,

            margin: '0 auto',
          }}
        >
          {promptComponent}
        </div>
      </div>
    </div>
  );
});

function PromptForm({
  isResponding = false,
  onSubmit,
}: {
  isResponding: boolean;
  onSubmit?: (prompt: string) => void;
}) {
  const [prompt, setPrompt] = useState('');

  return (
    <Box
      sx={{
        paddingBottom: '1rem',
      }}
      component="form"
      noValidate
      autoComplete="false"
      onSubmit={(e) => {
        e.preventDefault();
        if (prompt) {
          onSubmit?.(prompt);
          setPrompt('');
        }
      }}
    >
      <TextField
        id="prompt-input"
        placeholder="Message ChatGPT"
        variant="outlined"
        fullWidth
        multiline
        InputProps={{
          endAdornment: (
            <PromptSubmitButton
              disabled={isResponding || prompt.length === 0}
            />
          ),
        }}
        value={prompt}
        onChange={(e) => {
          const value = e.target.value;
          setPrompt(value);
        }}
      />
    </Box>
  );
}

function PromptSubmitButton({ disabled = false }) {
  const bgColor = disabled ? 'gray' : 'black';

  return (
    <Button
      variant="contained"
      disabled={disabled}
      type="submit"
      sx={{
        minWidth: 'initial',
        padding: '2px',
        backgroundColor: bgColor,

        '&:hover': {
          backgroundColor: bgColor,
        },
      }}
    >
      <Box sx={{ color: 'white' }} component={SendEnabled}></Box>
    </Button>
  );
}

function ChatMessage({ isUser = true, content = '' }) {
  return (
    <Box sx={{ display: 'flex', columnGap: '12px', py: '8px' }}>
      <ChatAvatar isUser={isUser} />
      <Box>
        <div style={{ fontWeight: '600' }}>{isUser ? 'You' : 'ChatGPT'}</div>
        <div>{content}</div>
      </Box>
    </Box>
  );
}

function ChatAvatar({ isUser = true }) {
  const styles = {
    color: isUser ? 'white' : 'rgb(13, 13, 13)',
    bgcolor: isUser ? 'rgb(121, 137, 255)' : 'white',
    icon: isUser ? AvatarMe : AvatarBot,
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: '24px',
          width: '24px',
          border: '1px solid rgb(227, 227, 227)',
          borderRadius: '50%',
          bgcolor: styles.bgcolor,
          color: styles.color,
        }}
      >
        <Box sx={{ height: '16px', width: '16px' }} component={styles.icon} />
      </Box>
    </>
  );
}

async function askAiMock(
  prompt: string,
  handleChunk: (answer: string) => void
) {
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  for (let i = 0; i < 10; i++) {
    await sleep(500);
    const answer = `answer chunk ${i} for ${prompt}`;
    handleChunk(answer);
  }
}

async function askAi(
  session: Round[],
  prompt: string,
  handleChunk: (part: string) => void
) {
  const context: { role: string; content: string }[] = [];
  session.forEach((item) => {
    context.push({
      role: 'user',
      content: item.user,
    });
    context.push({
      role: 'assistant',
      content: item.bot,
    });
  });

  const res = await fetch(
    'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization:
          'Bearer 54aede81cd0115d797fe21619efad814.TITeEyLL6JZQzlQS',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'glm-3-turbo',
        stream: true,
        messages: [
          ...context,
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    }
  );

  const stream = res.body!;
  const reader = stream.getReader();
  const readData = async () => {
    const { value, done } = await reader.read();
    if (done) {
      return;
    }

    const strValue = new TextDecoder().decode(value);
    strValue
      .split('\n\n')
      .filter((item) => item)
      .forEach((item) => {
        try {
          const msg = JSON.parse(item.replace('data:', '')).choices[0].delta
            .content;
          handleChunk(msg);
        } catch {}
      });

    // recursion
    readData();
  };
  readData();
}

export default App;
