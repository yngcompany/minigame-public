// 놀이 방법 버튼 클릭 이벤트
$('.btn-howToPlay').click(function() {
    $('.guide').addClass('show'); // .guide에 .show 클래스 추가
    startGuide(); // 가이드 시작
});

// 가이드 시작 함수
function startGuide() {
    var currentDesc = 0;
    var descElements = $('.guide .desc'); // 모든 .desc 요소들
    var audioFiles = ['sample_01.mp3', 'sample_02.mp3', 'sample_03.mp3', 'sample_04.mp3']; // MP3 파일 배열
    var audio = new Audio(); // 오디오 객체

    // 첫번째 가이드를 active로 설정하고 MP3 재생 시작
    $(descElements[0]).addClass('active');
    playAudio(currentDesc);

    // mp3파일 재생
    function playAudio(index) {
        if (index < audioFiles.length) {
            audio.src = audioFiles[index];
            audio.play();

            // mp3파일 재생이 끝나면 다음 가이드로 이동
            audio.onended = function() {
                $(descElements[index]).removeClass('active'); // 현재 active 제거
                if (index + 1 < descElements.length) {
                    currentDesc = index + 1;
                    $(descElements[currentDesc]).addClass('active'); // 다음 .desc에 active 추가
                    playAudio(currentDesc); // 다음 MP3 파일 재생
                } else {
                    // 모든 가이드가 끝났을 때 처리 (예: 팝업 닫기 등)
                    // closeGuide();
                }
            };
        }
    }

    // 가이드 닫기
    $('.guide .btn-close').click(function() {
        closeGuide();
    });

    // 가이드 종료
    function closeGuide() {
        audio.pause(); // 오디오 멈춤
        $('.guide').removeClass('show'); // 가이드 창 닫기
        $(descElements).removeClass('active'); // 모든 active 클래스 제거
    }
}


$(document).ready(function() {
    
    var currentQuestion = 0;
    var totalQuestions = 10;
    var correctAnswers = 0;
    var timeLeft = 20;
    var timer;
    var retryUsed = false; // 재도전 사용 여부
    var vegetables = ["carrot", "tomato", "onion", "cucumber", "radish", "cabbage", "eggplant", "beet", "paprika", "pepper"]; // 각 문제에 해당하는 vegetable 클래스명

    var cat = $('.cat');
    var status = $('.vegetable .status');

    // 게임 시작 버튼 클릭 이벤트
    $('.btn-gameStart').click(function() {
        resetGame();  // 게임 시작 시 초기화
        $('#main').removeClass('show');
        $('.wrap-farm').addClass('show');
        startTimer();
        showQuestion(currentQuestion); // 첫 문제 보여주기
    });

    // 타이머 시작 함수
    function startTimer() {
        clearInterval(timer);  // 중복 타이머 방지 (게임 올 정답으로 클리어 후 처음부터 다시 시작할 시 타이머 중복되는 이슈 있어서 넣어둠 2024-09-29 Jay Yu)
        timeLeft = 20;
        updateTimerDisplay();
        timer = setInterval(function() {
            timeLeft--;
            updateTimerDisplay();
            if(timeLeft <= 0) {
                clearInterval(timer);
                handleWrongAnswer(); // 시간이 다 되면 오답 처리
            }
        }, 9999000); // 테스트에 용이하도록 타이머 시간을 늘림. 전달 시 반드시 1000 (1초) 으로 수정 요망!
    }

    // 타이머 정지 함수
    function pauseTimer() {
        clearInterval(timer);
    }

    function updateTimerDisplay() {
        $('.timer').text(`시간: ${timeLeft}초`);
    }

    function resetTimer() {
        clearInterval(timer);
        startTimer();
    }

    function showQuestion(index) {
        var q = questions[index];
        $('.area-question .question').text(q.question);
        updateQuestionNumber(index);

        // 문제 유형에 따른 버튼 구성
        if(q.type === "OX") {
            $('.wrap-quiz .wrap-btn').html(`
                <button class="btn-answer-right"><span>O</span></button>
                <button class="btn-answer-wrong"><span>X</span></button>
            `);
        } else if (q.type === "multiple") {
            $('.wrap-quiz .wrap-btn').html(q.choices.map(choice => `<button class="btn-answer-choice"><span>${choice}</span></button>`).join(''));
        } else if (q.type === "short") {
            $('.wrap-quiz .wrap-btn').html('<textarea class="answer-text"></textarea><button class="btn-answer-submit">제출</button>');
        }

        // 이전 게임 결과가 유지되도록 .status를 업데이트
        var currentStatus = status.eq(index).parent('.vegetable').hasClass('success') ? '수확 성공' :
            status.eq(index).parent('.vegetable').hasClass('fail') ? '실패' : '수확중';
        status.eq(index).text(currentStatus).show();

        // 정답 버튼 클릭 이벤트
        $('.wrap-quiz .wrap-btn button').click(function() {
            var answer = $(this).text();
            checkAnswer(q, answer, index);
        });
    }

    // 문제 번호 업데이트
    function updateQuestionNumber(index) {
        $('.badge-num').text(`문제 ${index + 1}`);
    }

    // 정답 처리
    function checkAnswer(q, answer, index) {
        if(q.type === "short") { answer = $('.answer-text').val(); }
        
        // 문제를 풀은 순간에 타이머 일시 정지 (문제를 1초 미만으로 남겨놓고 풀었을 때 오류를 방지하기 위해 해당 함수가 필요함 2024-09-30 Jay Yu)
        pauseTimer();
        cat.removeClass('success fail');

        if(answer === q.correctAnswer) {
            cat.addClass('success');
            status.eq(index).text('수확 성공');
            status.eq(index).parent('.vegetable').addClass('success');
            correctAnswers++;
        } else {
            cat.addClass('fail');
            status.eq(index).text('실패');
            status.eq(index).parent('.vegetable').addClass('fail');
        }

        // 버튼 비활성화
        $('.wrap-quiz .wrap-btn button').prop('disabled', true);

        // 고양이가 점프해 이동하는 애니메이션 실행 후 다음 문제로 이동
        moveToNextQuestion();
    }

    function handleWrongAnswer() {
        cat.removeClass('success').addClass('fail');
        status.eq(currentQuestion).text('실패');
        moveToNextQuestion();
    }

    // 다음 문제로 이동 (재도전 시 첫번째 틀린 문제가 나오도록 수정 2024-09-30 Jay Yu)
    function moveToNextQuestion() {
        // 틀린 문제만 찾아서 이동
        var nextQuestion = currentQuestion + 1;

        // 다음 틀린 문제를 찾음
        while (nextQuestion < totalQuestions && $(".vegetable").eq(nextQuestion).hasClass("disabled")) {
            nextQuestion++;
        }

        if (nextQuestion < totalQuestions) {
            // 고양이가 한 칸씩 이동하면서 각 문제를 지나감
            var step = currentQuestion + 1; // 현재 위치에서 다음으로 이동할 칸
            function moveCatStep() {
                if(step <= nextQuestion) {
                    cat.delay(200).queue(function(next) { // 문제를 풀고 고양이가 이동하는 부분
                        cat.addClass('jump').css('left', `+=120px`);
                        next();
                    }).delay(750).queue(function(next) {
                        cat.removeClass('jump');
                        step++;
                        next();
                        moveCatStep();
                    });
                } else {
                    // 모든 이동이 완료되면 다음 틀린 문제에 도착
                    currentQuestion = nextQuestion; // 고양이가 도착한 문제를 현재 문제로 업데이트
                    setTimeout(function() {
                        resetTimer();
                        showQuestion(currentQuestion);
                        $(".wrap-quiz .wrap-btn button").prop("disabled", false); // 버튼 다시 활성화
                    }, 100);
                }
            }

            moveCatStep(); // 고양이의 이동 시작
        } else {
            // 문제를 다 풀었을 때, alert창을 띄우기 전 약간의 딜레이 추가 (마지막 문제가 수확 성공인지 실패인지 시각적으로 확인하게 하기 위함 2024-09-30 Jay Yu)
            setTimeout(function() {
                clearInterval(timer);
                showEndAlert(); // 마지막 문제까지 모두 풀었을 때 Alert 표시
            }, 1000);
        }
    }

    // 문제를 모두 풀었을 때 Alert 표시
    function showEndAlert() {
        alert("문제를 모두 풀었습니다! 결과 화면으로 이동할까요?");
        checkResult();
    }

    // "게임 재도전" 시 정답을 맞춘 문제 비활성화
    function disableCorrectVegetables() {
        $(".vegetable.success").addClass("disabled");
    }

    // 결과 계산 함수
    function checkResult() {
        $('.wrap-farm').removeClass('show');

        if (correctAnswers === totalQuestions) {
            $('.wrap-result.result-clear').addClass('show');
            displayCorrectVegetables(); // 맞춘 문제에 해당하는 vegetable 표시
        } else if (retryUsed) {
            // 재도전 후 틀린 문제가 있으면 .result-refail 페이지로 이동
            $('.wrap-result.result-wrong').removeClass('show');
            $('.wrap-result.result-refail').addClass('show');
            displayCorrectVegetables(); // 맞춘 문제에 해당하는 vegetable 표시
        } else {
            $('.wrap-result.result-wrong').addClass('show');
            displayCorrectVegetables(); // 맞춘 문제에 해당하는 vegetable 표시
        }

        $('.count-num').text(correctAnswers);
    }

    // 맞춘 문제의 vegetable을 .obj-get 안에 표시하는 함수
    function displayCorrectVegetables() {
        let correctVegetables = [];
        status.each(function(index) {
            if ($(this).text() === '수확 성공') {
                let vegetableClass = vegetables[index]; // vegetables 배열에서 해당 클래스명 가져오기
                correctVegetables.push(`<span class="vegetable ${vegetableClass}"></span>`);
            }
        });
        $('.obj-get').html(correctVegetables.join(''));
    }

    // 재도전 기능
    $('.btn-replay').click(function() {
        if (!retryUsed) { // 재도전이 사용되지 않은 경우
            retryUsed = true; // 재도전 사용으로 설정
            correctAnswers = 0;
            disableCorrectVegetables(); // 정답을 맞춘 문제 비활성화
            setCatPosition(); // 틀린 문제 위치로 고양이 이동
            cat.removeClass('success fail');
            $('.wrap-farm').addClass('show');

            // "틀린 문제들" 중에서 제일 첫 번째 문제로 `currentQuestion` 을 설정
            var firstIncorrect = $(".vegetable.fail").first();
            currentQuestion = $(".vegetable").index(firstIncorrect);

            resetTimer();
            showQuestion(currentQuestion);
        }
    });

    // "게임 재도전" 시 고양이 위치 설정
    // function setCatPosition() {
    //     // 첫 번째 틀린 문제 찾기
    //     var firstIncorrect = $(".vegetable.fail").first();
    //     if (firstIncorrect.length) {
    //         // 요소가 렌더링되었는지 확인 후, 약간의 딜레이를 줘서 위치 계산 (요소가 완전히 렌더링되기 전에 offset으로 위치값을 가져오려 하면 0을 반환하는 오류가 있음 2024-09-30 Jay Yu)
    //         setTimeout(function() {
    //             var position = firstIncorrect.offset().left;
    //             var vegetableWidth = firstIncorrect.outerWidth(); // 틀린 문제의 너비
    //             var catWidth = cat.outerWidth(); // 고양이의 너비

    //             // 고양이 위치 포지셔닝
    //             var catPosition = (position + vegetableWidth / 2) - 40; // 고양이의 위치를 좀 더 왼쪽으로 조정하여 벗어나는 문제 해결

    //             // 계산된 위치로 고양이를 이동
    //             cat.css({ left: catPosition });
    //             currentQuestion = $(".vegetable").index(firstIncorrect); // "틀린 문제들" 중에서 첫번째 문제를 현재의 문제로 설정
    //         }, 100); // 100ms 딜레이 후 위치 계산
    //     }
    // }
    var catPositions = [66, 185, 304, 425, 545, 665, 785, 904, 1024, 1144]; // 각 문제별 left 위치
    function setCatPosition() {
        var firstIncorrect = $(".vegetable.fail").first();
        if (firstIncorrect.length) {
            // 첫 번째 틀린 문제의 인덱스를 가져와서 그에 해당하는 좌표값으로 이동
            var incorrectIndex = $(".vegetable").index(firstIncorrect);
            var catPosition = catPositions[incorrectIndex]; // 사전에 설정된 좌표값 사용
    
            cat.css({ left: catPosition + 'px' });
            currentQuestion = incorrectIndex; // 현재 질문을 틀린 문제로 설정
        }
    }
    


    // 게임 종료 버튼 클릭 시 게임을 초기화하고 메인화면으로 돌아가기
    $('.btn-endplay').click(function() {
        resetGame();
        resetResults();
        $('#main').addClass('show'); // 메인 화면으로 돌아가기
    });

    // 게임 재시작
    $('.btn-restart').click(function() {
        resetGame();
    });

    // 게임 기록 초기화
    function resetGame() {
        currentQuestion = 0;
        correctAnswers = 0;
        retryUsed = false;
        // status.text('');
        // .status 요소의 텍스트를 초기화
        status.each(function() {
            $(this).text('');
        });
        cat.removeClass('success fail');
        $('.vegetable').removeClass('success fail disabled');
        cat.css({ left: '66px' });
        $('.wrap-farm').addClass('show');
        startTimer();
        showQuestion(currentQuestion);
    }

    // 결과 페이지 초기화
    function resetResults() {
        $('.wrap-result').removeClass('show'); // 모든 결과 페이지에서 "show" 클래스 제거
        $('.wrap-farm').removeClass('show'); // 게임플레이 페이지 끄기
    }

});