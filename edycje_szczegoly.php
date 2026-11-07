<?php
  include("conn.php");

  if(isset($_GET['id']))
  {
    $id = mysqli_real_escape_string($conn, $_GET['id']);
    $query = "SELECT edycje.id AS 'ed' ,panstwa.nazwa AS 'kraj' ,uczestnicy.nick AS 'nick' ,piosenki.utwor AS 'pios', wygrana, piosenkaudzial.iduczestnika, piosenkaudzial.idpanstwa, edycje.scorewiz AS 'scorewiz' FROM piosenkaudzial JOIN edycje ON edycje.id=piosenkaudzial.idedycji JOIN panstwa ON panstwa.id=piosenkaudzial.idpanstwa JOIN piosenki ON piosenki.id=piosenkaudzial.idpiosenki JOIN uczestnicy ON uczestnicy.id=piosenkaudzial.iduczestnika WHERE idedycji=$id ORDER BY kraj";
    $result = mysqli_query($conn,$query);
    $piosenki = mysqli_fetch_all($result, MYSQLI_ASSOC);
    mysqli_free_result($result);
    $query2 = "SELECT scorewiz FROM edycje WHERE id=$id";
    $result2 = mysqli_query($conn,$query2);
    $scorewiz = mysqli_fetch_row($result2);
    $scorewizlink = explode(" ; ",$scorewiz[0]);
    mysqli_close($conn);
  }
?>

<!doctype html>
<html lang="en">
  <head>
    <title>Edycje - szczegóły</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
    <link rel="stylesheet" href="css/bootstrap.min.css">
    <link rel="stylesheet" href="style1.css">
  </head>
  <body>
      <?php
         include("nav.php");
      ?>

      <section>
        <p class="tytul">Edycja <?php echo $id?></p>
        <p>
          <b>Scorewiz:</b>
          <?php
          if($scorewiz[0]!=="")
          {
            $i=1;
            foreach($scorewizlink as $row)
            {
              echo '<a href='.$row.'>[ '.$i.' ]</a> ';
              $i++;
            }
          }
          else
          {
            echo 'brak';
          }
          ?>
        </p>

      <div id="tabela">
          <?php if($id>1) { ?>
            <form style="float:left;" action="edycje_szczegoly.php?id=<?php echo $id-1 ?>" method="post">
              <input type="submit" value="Poprzednia edycja">
            </form>
          <?php } ?>
          <?php if($id<100) { ?>
            <form style="float:right;" action="edycje_szczegoly.php?id=<?php echo $id+1 ?>" method="post">
              <input type="submit" value="Następna edycja">
            </form>
          <?php } ?>
          <br><br>

        <table>
          <th colspan="2">Utwór</th>
          <th>Państwo</th>
          <th>Uczestnik</th>
          <?php foreach($piosenki as $row) { ?>
            <tr <?php if($row['wygrana']==TRUE) { echo 'style="font-weight: bold;"'; }?>>
              <td class="yt"><a href="https://www.youtube.com/results?search_query=<?php echo str_replace('&', '', $row['pios']); ?>" target="_blank"><img src="img/yt.png"></a></td>
              <td><?php echo htmlspecialchars($row['pios']); ?></td>
              <td class="px200"><a href="panstwa_szczegoly.php?id=<?php echo $row['idpanstwa'];?>"><?php echo '<img width=20px src="img/flags/' . $row['kraj'] . '.png" alt=""> ' . htmlspecialchars($row['kraj']); ?></a></td>
              <td class="px200"><a href="uczestnicy_szczegoly.php?id=<?php echo $row['iduczestnika'];?>"><?php echo htmlspecialchars($row['nick']); ?></a></td>
            </tr>
          <?php } ?>
          </table>

          <br>
      </div>
      </section>
      
      <?php
         include("footer.php");
      ?>

    <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
    <script src="js/bootstrap.min.js"></script>
  </body>
</html>